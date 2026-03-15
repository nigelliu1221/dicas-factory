const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_KEY });

const DB = {
  brands: '3241d214-f129-816f-9b41-f860b23b96f9',
  products: '3241d214-f129-8187-8f34-e35a0a8f6d3a',
  parts: '3241d214-f129-81e6-9c18-e1f4a84a541f',
  orders: '3241d214-f129-81f5-91de-d5a9920c5b07',
  outsource: '3241d214-f129-8123-a4c4-cf6f7699b9a8',
  suppliers: '3241d214-f129-814a-8f88-e0da4a69c28b',
  issues: '3241d214-f129-811e-9e93-d5a8a0e3842a',
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // brands
    const brandsRes = await notion.databases.query({ database_id: DB.brands });
    const brands = brandsRes.results.map(p => ({
      name: p.properties.brand_name?.rich_text?.[0]?.plain_text || '',
      contact: p.properties.contact_person?.rich_text?.[0]?.plain_text || '',
      status: p.properties.status?.select?.name || '',
    }));

    // parts
    const partsRes = await notion.databases.query({ database_id: DB.parts });
    const parts = partsRes.results.map(p => ({
      name: p.properties.part_name?.rich_text?.[0]?.plain_text || '',
      number: p.properties.part_number?.rich_text?.[0]?.plain_text || '',
      stock: p.properties.stock_qty?.number || 0,
      safety: p.properties.safety_stock?.number || 0,
      inTransit: p.properties.in_transit_qty?.number || 0,
    }));

    // outsource
    const outRes = await notion.databases.query({ database_id: DB.outsource });
    const outsource = await Promise.all(outRes.results.map(async p => {
      let supplier = '未知', part = '未知';
      try {
        if (p.properties.supplier_id?.relation?.[0]?.id) {
          const s = await notion.pages.retrieve({ page_id: p.properties.supplier_id.relation[0].id });
          supplier = s.properties.supplier_name?.rich_text?.[0]?.plain_text || '未知';
        }
        if (p.properties.part_id?.relation?.[0]?.id) {
          const pt = await notion.pages.retrieve({ page_id: p.properties.part_id.relation[0].id });
          part = pt.properties.part_name?.rich_text?.[0]?.plain_text || '未知';
        }
      } catch(e) {}
      return {
        supplier, part,
        qty: p.properties.sent_qty?.number || 0,
        status: p.properties.status?.select?.name || '',
      };
    }));

    // issues
    const issuesRes = await notion.databases.query({ 
      database_id: DB.issues,
      filter: { property: 'status', select: { does_not_equal: '已結案' } }
    });
    const issues = issuesRes.results.map(p => ({
      id: p.id,
      type: p.properties.issue_type?.select?.name || '',
      severity: p.properties.severity?.select?.name || '',
      status: p.properties.status?.select?.name || '',
      description: p.properties.description?.rich_text?.[0]?.plain_text || '',
    }));

    // suppliers
    const supRes = await notion.databases.query({ database_id: DB.suppliers });
    const suppliers = supRes.results.map(p => ({
      name: p.properties.supplier_name?.rich_text?.[0]?.plain_text || '',
      capacity: p.properties.monthly_capacity?.number || 10000,
      aliases: p.properties.aliases?.multi_select?.map(a => a.name) || [],
    }));

    // 計算負載率 (mock)
    const suppliersWithLoad = suppliers.map(s => ({
      name: s.name,
      load: Math.floor(Math.random() * 30 + 50), // mock: 50-80%
    }));

    res.json({
      kpi: {
        activeOrders: 5,
        monthlyTarget: 8500,
        yield: 98.1,
        inTransit: outsource.reduce((sum, o) => sum + o.qty, 0),
        openIssues: issues.length,
      },
      inventory: parts.map(p => ({
        name: p.name,
        number: p.number,
        stock: p.stock,
        safety: p.safety,
        inTransit: p.inTransit,
        status: p.stock === 0 ? 'danger' : p.stock < p.safety ? 'warning' : 'ok'
      })),
      outsource: outsource.slice(0, 6),
      issues,
      suppliers: suppliersWithLoad,
      brands,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
