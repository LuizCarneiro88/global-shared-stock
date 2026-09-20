function state(material) {
  const current = Number(material.quantityCurrent ?? material.quantity) || 0;
  const reserved = Math.max(0, Number(material.quantityReserved) || 0);
  const sold = Math.max(0, Number(material.quantitySold) || 0);
  return { current, reserved, sold, available: Math.max(0, current - reserved - sold) };
}

function withState(material, quantities) {
  return {
    ...material,
    quantity: quantities.current,
    quantityCurrent: quantities.current,
    quantityReserved: quantities.reserved,
    quantitySold: quantities.sold,
    quantityAvailable: quantities.available,
  };
}

function advertisementWithState(advertisement, quantities, soldOut = false) {
  if (!advertisement) return null;
  const now = new Date();
  return {
    ...advertisement,
    quantity: quantities.available,
    quantityAvailable: quantities.available,
    status: soldOut ? "sold_display" : "published",
    ...(soldOut ? { soldAt: now.toISOString(), removeFromShowcaseAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() } : { soldAt: null, removeFromShowcaseAt: null }),
  };
}

async function restore(env, key, previous) {
  if (previous === null) await env.CADASTROS.delete(key);
  else await env.CADASTROS.put(key, JSON.stringify(previous));
}

async function saveInventory(env, materialKey, previousMaterial, material, advertisementKey, previousAdvertisement, advertisement, reservationKey, previousReservation, reservation) {
  try {
    await env.CADASTROS.put(materialKey, JSON.stringify(material));
    if (advertisement) await env.CADASTROS.put(advertisementKey, JSON.stringify(advertisement));
    if (reservation) await env.CADASTROS.put(reservationKey, JSON.stringify(reservation));
  } catch (caught) {
    await Promise.allSettled([
      restore(env, materialKey, previousMaterial),
      restore(env, advertisementKey, previousAdvertisement),
      restore(env, reservationKey, previousReservation),
    ]);
    throw caught;
  }
}

export async function reserveInventory(env, interest, requestedQuantity, responsible) {
  const quantity = Number(requestedQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("A quantidade reservada precisa ser maior que zero.");
  const materialKey = `material:${interest.sellerCompanyId}:${interest.materialId}`;
  const advertisementKey = `anuncio:${interest.materialId}`;
  const reservationKey = `reserva:${interest.id}`;
  const [material, advertisement, previousReservation] = await Promise.all([
    env.CADASTROS.get(materialKey, "json"),
    env.CADASTROS.get(advertisementKey, "json"),
    env.CADASTROS.get(reservationKey, "json"),
  ]);
  if (!material || !advertisement || advertisement.status !== "published") throw new Error("O material não está disponível para reserva.");
  const quantities = state(material);
  const previousQuantity = previousReservation?.status === "active" ? Number(previousReservation.quantity) || 0 : 0;
  const availableForThisNegotiation = quantities.available + previousQuantity;
  if (quantity > availableForThisNegotiation) throw new Error(`Saldo insuficiente. Há ${quantities.available} unidade(s) disponível(is) além da reserva atual desta negociação.`);
  const updatedQuantities = {
    current: quantities.current,
    reserved: Math.max(0, quantities.reserved - previousQuantity + quantity),
    sold: quantities.sold,
    available: Math.max(0, quantities.current - (quantities.reserved - previousQuantity + quantity) - quantities.sold),
  };
  const now = new Date().toISOString();
  const reservation = {
    id: previousReservation?.id || crypto.randomUUID(),
    materialId: interest.materialId,
    interestId: interest.id,
    companyId: interest.sellerCompanyId,
    userId: responsible || "admin",
    quantity,
    status: "active",
    createdAt: previousReservation?.createdAt || now,
    updatedAt: now,
  };
  await saveInventory(env, materialKey, material, withState(material, updatedQuantities), advertisementKey, advertisement, advertisementWithState(advertisement, updatedQuantities), reservationKey, previousReservation, reservation);
  return { reservation, quantities: updatedQuantities };
}

export async function releaseInventory(env, interest, responsible, reason) {
  const materialKey = `material:${interest.sellerCompanyId}:${interest.materialId}`;
  const advertisementKey = `anuncio:${interest.materialId}`;
  const reservationKey = `reserva:${interest.id}`;
  const [material, advertisement, previousReservation] = await Promise.all([
    env.CADASTROS.get(materialKey, "json"),
    env.CADASTROS.get(advertisementKey, "json"),
    env.CADASTROS.get(reservationKey, "json"),
  ]);
  if (!previousReservation || previousReservation.status !== "active") return null;
  if (!material) throw new Error("O material da reserva não foi encontrado.");
  const quantities = state(material);
  const released = Math.min(quantities.reserved, Number(previousReservation.quantity) || 0);
  const updatedQuantities = { current: quantities.current, reserved: quantities.reserved - released, sold: quantities.sold, available: Math.max(0, quantities.current - (quantities.reserved - released) - quantities.sold) };
  const reservation = { ...previousReservation, userId: responsible || "admin", status: "released", reason, updatedAt: new Date().toISOString(), releasedOrConvertedAt: new Date().toISOString() };
  await saveInventory(env, materialKey, material, withState(material, updatedQuantities), advertisementKey, advertisement, advertisementWithState(advertisement, updatedQuantities), reservationKey, previousReservation, reservation);
  return { reservation, quantities: updatedQuantities };
}

export async function convertReservationToSale(env, interest, responsible) {
  const materialKey = `material:${interest.sellerCompanyId}:${interest.materialId}`;
  const advertisementKey = `anuncio:${interest.materialId}`;
  const reservationKey = `reserva:${interest.id}`;
  const [material, advertisement, previousReservation] = await Promise.all([
    env.CADASTROS.get(materialKey, "json"),
    env.CADASTROS.get(advertisementKey, "json"),
    env.CADASTROS.get(reservationKey, "json"),
  ]);
  if (!previousReservation || previousReservation.status !== "active") throw new Error("Esta negociação não possui uma reserva ativa.");
  if (!material) throw new Error("O material da reserva não foi encontrado.");
  const quantities = state(material);
  const soldQuantity = Number(previousReservation.quantity) || 0;
  const updatedQuantities = {
    current: quantities.current,
    reserved: Math.max(0, quantities.reserved - soldQuantity),
    sold: quantities.sold + soldQuantity,
    available: Math.max(0, quantities.current - Math.max(0, quantities.reserved - soldQuantity) - (quantities.sold + soldQuantity)),
  };
  const now = new Date().toISOString();
  const reservation = { ...previousReservation, userId: responsible || "admin", status: "converted_to_sale", updatedAt: now, releasedOrConvertedAt: now };
  await saveInventory(env, materialKey, material, withState(material, updatedQuantities), advertisementKey, advertisement, advertisementWithState(advertisement, updatedQuantities, updatedQuantities.available === 0), reservationKey, previousReservation, reservation);
  return { reservation, quantities: updatedQuantities };
}
