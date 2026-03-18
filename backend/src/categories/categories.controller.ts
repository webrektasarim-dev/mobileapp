import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async tree() {
    const all = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const map = new Map<string, unknown[]>();
    for (const c of all) {
      const pid = c.parentId ?? 'root';
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        children: [] as unknown[],
      });
    }
    const attach = (parentId: string | null): unknown[] => {
      const key = parentId ?? 'root';
      const nodes = (map.get(key) ?? []) as Array<{
        id: string;
        children: unknown[];
      }>;
      for (const n of nodes) {
        n.children = attach(n.id) as unknown[];
      }
      return nodes as unknown[];
    };
    return attach(null);
  }
}
