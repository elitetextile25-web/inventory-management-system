import { prisma } from "@/lib/db";

// Prefix mapping for product types
export const PRODUCT_TYPE_PREFIXES: Record<string, string> = {
  ORDER: "ORD",
  KNITTING: "KNT",
  FINISHED_PRODUCT: "PRD",
  RAW_MATERIAL: "RAW",
  FABRIC: "FAB",
  ACCESSORIES: "ACC",
  CUSTOM: "CUS",
};

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  ORDER: "Order",
  KNITTING: "Knitting",
  FINISHED_PRODUCT: "Finished Product",
  RAW_MATERIAL: "Raw Material",
  FABRIC: "Fabric",
  ACCESSORIES: "Accessories",
  CUSTOM: "Custom",
};

/**
 * Determines the 3-letter prefix for a product code based on category or product type
 */
export function getProductCodePrefix(type?: string | null, categoryName?: string | null): string {
  if (categoryName) {
    const cleanCat = categoryName.trim().toUpperCase();
    if (cleanCat.includes("T-SHIRT") || cleanCat.includes("TSHIRT") || cleanCat.includes("POLO")) {
      return "TSH";
    }
    if (cleanCat.includes("FABRIC") || cleanCat.includes("TEXTILE") || cleanCat.includes("CLOTH") || cleanCat.includes("SILK") || cleanCat.includes("COTTON") || cleanCat.includes("LINEN")) {
      return "FAB";
    }
    if (cleanCat.includes("KNIT") || cleanCat.includes("SWEATER")) {
      return "KNT";
    }
    if (cleanCat.includes("DENIM") || cleanCat.includes("JEANS")) {
      return "DNM";
    }
    if (cleanCat.includes("SHIRT") || cleanCat.includes("PANJABI") || cleanCat.includes("DRESS") || cleanCat.includes("GARMENT")) {
      return "APP";
    }
  }

  if (type && PRODUCT_TYPE_PREFIXES[type]) {
    return PRODUCT_TYPE_PREFIXES[type];
  }

  return "PRD";
}

/**
 * Atomically generates the next unique product code for an organization
 * Format: {PREFIX}-{000001}
 */
export async function generateUniqueProductCode(
  tx: any,
  organizationId: string,
  prefix: string
): Promise<string> {
  const sequenceType = `PRODUCT_${prefix}`;

  // Find or create document sequence record
  let seq = await tx.documentSequence.findFirst({
    where: {
      organizationId,
      type: sequenceType,
    },
  });

  if (!seq) {
    // Check how many products already start with this prefix to seed counter accurately
    const existingCount = await tx.product.count({
      where: {
        organizationId,
        OR: [
          { productCode: { startsWith: `${prefix}-` } },
          { sku: { startsWith: `${prefix}-` } },
        ],
      },
    });

    seq = await tx.documentSequence.create({
      data: {
        organizationId,
        type: sequenceType,
        prefix,
        lastNumber: existingCount + 1,
        padding: 6,
      },
    });
  } else {
    seq = await tx.documentSequence.update({
      where: { id: seq.id },
      data: {
        lastNumber: { increment: 1 },
      },
    });
  }

  let nextNum = seq.lastNumber;
  let candidate = `${prefix}-${String(nextNum).padStart(6, "0")}`;

  // Double check uniqueness against productCode and sku
  let exists = await tx.product.findFirst({
    where: {
      organizationId,
      OR: [{ productCode: candidate }, { sku: candidate }],
    },
    select: { id: true },
  });

  while (exists) {
    nextNum += 1;
    candidate = `${prefix}-${String(nextNum).padStart(6, "0")}`;
    exists = await tx.product.findFirst({
      where: {
        organizationId,
        OR: [{ productCode: candidate }, { sku: candidate }],
      },
      select: { id: true },
    });
    await tx.documentSequence.update({
      where: { id: seq.id },
      data: { lastNumber: nextNum },
    });
  }

  return candidate;
}

/**
 * Preview product code generation without committing an increment
 */
export async function previewNextProductCode(
  organizationId: string,
  prefix: string
): Promise<string> {
  const sequenceType = `PRODUCT_${prefix}`;
  const seq = await prisma.documentSequence.findFirst({
    where: {
      organizationId,
      type: sequenceType,
    },
  });

  let nextNum = (seq?.lastNumber ?? 0) + 1;
  if (!seq) {
    const existingCount = await prisma.product.count({
      where: {
        organizationId,
        OR: [
          { productCode: { startsWith: `${prefix}-` } },
          { sku: { startsWith: `${prefix}-` } },
        ],
      },
    });
    nextNum = existingCount + 1;
  }

  let candidate = `${prefix}-${String(nextNum).padStart(6, "0")}`;
  let exists = await prisma.product.findFirst({
    where: {
      organizationId,
      OR: [{ productCode: candidate }, { sku: candidate }],
    },
    select: { id: true },
  });

  while (exists) {
    nextNum += 1;
    candidate = `${prefix}-${String(nextNum).padStart(6, "0")}`;
    exists = await prisma.product.findFirst({
      where: {
        organizationId,
        OR: [{ productCode: candidate }, { sku: candidate }],
      },
      select: { id: true },
    });
  }

  return candidate;
}

