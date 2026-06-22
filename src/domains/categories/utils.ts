export type CategoryHierarchyMetrics = {
  approvedListings: number
  pendingListings: number
  totalListings: number
}

export type CategoryHierarchyBase = {
  id: string
  name: string
  parentId: string | null
  sortOrder: number
}

export type CategoryHierarchyNode<T extends CategoryHierarchyBase = CategoryHierarchyBase> = T &
  CategoryHierarchyMetrics & {
    children: CategoryHierarchyNode<T>[]
    depth: number
    pathLabel: string
  }

function compareCategoryNodes(left: CategoryHierarchyBase, right: CategoryHierarchyBase) {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'pt-BR')
}

function aggregateMetrics(node: CategoryHierarchyNode) {
  for (const child of node.children) {
    aggregateMetrics(child)
    node.approvedListings += child.approvedListings
    node.pendingListings += child.pendingListings
    node.totalListings += child.totalListings
  }
}

function annotateNode<T extends CategoryHierarchyBase>(
  node: CategoryHierarchyNode<T>,
  ancestorNames: string[],
  stack: string[],
) {
  if (stack.includes(node.id)) {
    throw new Error('Foi detectado um ciclo na hierarquia de categorias.')
  }

  node.depth = ancestorNames.length
  node.pathLabel = [...ancestorNames, node.name].join(' > ')

  const nextStack = [...stack, node.id]
  node.children.forEach((child) => annotateNode(child, [...ancestorNames, node.name], nextStack))
}

export function buildCategoryTree<T extends CategoryHierarchyBase>(
  items: T[],
  metricsById = new Map<string, CategoryHierarchyMetrics>(),
) {
  const nodes = new Map<string, CategoryHierarchyNode<T>>()

  items.forEach((item) => {
    const metrics = metricsById.get(item.id) ?? {
      approvedListings: 0,
      pendingListings: 0,
      totalListings: 0,
    }

    nodes.set(item.id, {
      ...item,
      approvedListings: metrics.approvedListings,
      children: [],
      depth: 0,
      pathLabel: item.name,
      pendingListings: metrics.pendingListings,
      totalListings: metrics.totalListings,
    })
  })

  const roots: CategoryHierarchyNode<T>[] = []

  nodes.forEach((node) => {
    if (node.parentId && node.parentId !== node.id) {
      const parent = nodes.get(node.parentId)

      if (parent) {
        parent.children.push(node)
        return
      }
    }

    roots.push(node)
  })

  const sortTree = (branch: CategoryHierarchyNode<T>[]) => {
    branch.sort(compareCategoryNodes)
    branch.forEach((node) => sortTree(node.children))
  }

  sortTree(roots)
  roots.forEach((node) => {
    annotateNode(node, [], [])
    aggregateMetrics(node)
  })

  return roots
}

export function flattenCategoryTree<T extends CategoryHierarchyBase>(
  nodes: CategoryHierarchyNode<T>[],
) {
  const flattened: CategoryHierarchyNode<T>[] = []

  const visit = (branch: CategoryHierarchyNode<T>[]) => {
    branch.forEach((node) => {
      flattened.push(node)
      visit(node.children)
    })
  }

  visit(nodes)

  return flattened
}

export function findCategoryNodeBySlug<T extends CategoryHierarchyBase & { slug: string }>(
  nodes: CategoryHierarchyNode<T>[],
  slug: string,
) {
  const stack = [...nodes]

  while (stack.length > 0) {
    const node = stack.shift()!

    if (node.slug === slug) {
      return node
    }

    stack.unshift(...node.children)
  }

  return null
}

export function findCategoryNodeById<T extends CategoryHierarchyBase>(
  nodes: CategoryHierarchyNode<T>[],
  id: string,
) {
  const stack = [...nodes]

  while (stack.length > 0) {
    const node = stack.shift()!

    if (node.id === id) {
      return node
    }

    stack.unshift(...node.children)
  }

  return null
}

export function collectCategoryAndDescendantIds<T extends CategoryHierarchyBase>(
  nodes: CategoryHierarchyNode<T>[],
  categoryId: string,
) {
  const node = findCategoryNodeById(nodes, categoryId)

  if (!node) {
    return []
  }

  return flattenCategoryTree([node]).map((item) => item.id)
}
