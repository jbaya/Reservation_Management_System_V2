// Role-based guard, layered on top of requireAuth. The JWT payload already
// carries userType (set at login), this just enforces it consistently
// instead of leaving every controller to check req.user.userType by hand.
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!allowedRoles.includes(req.user.userType)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  }
  next();
};
