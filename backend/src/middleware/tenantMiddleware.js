export default function tenantMiddleware(req, res, next) {
  const tenantId = req.header('x-tenant-id') || req.header('Tenant-Id') || req.query.tenantId;
  if (!tenantId && req.path !== '/api/health') {
    return res.status(400).json({ error: 'Tenant ID is required in x-tenant-id header' });
  }
  req.tenantId = tenantId;
  next();
}
