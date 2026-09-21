function active(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item.status !== "inactive");
}

function contactSnapshot(company, requestedId) {
  const contacts = active(company.commercialContacts);
  const contact = contacts.find((item) => item.id === requestedId)
    || contacts.find((item) => item.primary)
    || contacts[0];
  if (contact) {
    return {
      name: contact.name || "",
      role: contact.role || "",
      email: contact.email || "",
      phone: contact.phone || "",
      whatsapp: contact.whatsapp || "",
      preferredContact: contact.preferredContact || "email",
    };
  }
  return {
    name: company.primaryContact || "",
    role: company.primaryRole || "",
    email: company.primaryEmail || "",
    phone: company.primaryPhone || "",
    whatsapp: company.primaryWhatsapp || "",
    preferredContact: company.primaryContactPreference || "email",
  };
}

function locationSnapshot(company, requestedId) {
  const locations = active(company.stockLocations);
  const location = locations.find((item) => item.id === requestedId)
    || locations.find((item) => item.defaultForNewMaterials)
    || locations[0];
  if (!location) return null;
  return {
    name: location.name || "",
    country: location.country || "",
    state: location.state || "",
    protectedAddress: { ...(location.protectedAddress || {}) },
  };
}

export async function buildContactRelease(env, interest, releasedBy) {
  const [buyer, seller, material] = await Promise.all([
    env.CADASTROS.get(`cadastro:${interest.buyerCompanyId}:dados`, "json"),
    env.CADASTROS.get(`cadastro:${interest.sellerCompanyId}:dados`, "json"),
    env.CADASTROS.get(`material:${interest.sellerCompanyId}:${interest.materialId}`, "json"),
  ]);
  if (!buyer || !seller) throw new Error("Não foi possível localizar os dados das empresas desta negociação.");
  if (!material) throw new Error("Não foi possível localizar o material desta negociação.");
  const stockLocation = locationSnapshot(seller, material.stockLocationId);
  if (!stockLocation) throw new Error("O material não possui um local de estoque válido para liberar.");
  const releasedAt = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    interestId: interest.id,
    materialId: interest.materialId,
    releasedAt,
    releasedBy,
    buyer: { companyId: buyer.id, companyName: buyer.companyName, contact: contactSnapshot(buyer) },
    seller: { companyId: seller.id, companyName: seller.companyName, contact: contactSnapshot(seller, material.commercialContactId), stockLocation },
  };
}
