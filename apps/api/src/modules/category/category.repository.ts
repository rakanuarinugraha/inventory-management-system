import prisma from "../../lib/prisma";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.schema";

export class CategoryRepository {
  async findAll() {
    return prisma.category.findMany({
      include: { children: true, parent: true },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  }

  async create(data: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        name: data.name,
        parentId: data.parentId ?? null,
      },
      include: { parent: true },
    });
  }

  async update(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
      include: { parent: true, children: true },
    });
  }

  async delete(id: string) {
    return prisma.category.delete({ where: { id } });
  }

  async findByName(name: string) {
    return prisma.category.findFirst({ where: { name } });
  }

  async hasProducts(id: string) {
    const count = await prisma.product.count({ where: { categoryId: id } });
    return count > 0;
  }

  async hasChildren(id: string) {
    const count = await prisma.category.count({ where: { parentId: id } });
    return count > 0;
  }
}
