export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  parent: Category | null;
  children: Category[];
}

export interface CreateCategoryInput {
  name: string;
  parentId?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: string | null;
}
