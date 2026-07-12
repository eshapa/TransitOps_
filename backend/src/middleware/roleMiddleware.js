function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleName) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden. No role associated with user.' }
      });
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        error: { message: `Forbidden. Access restricted to roles: ${allowedRoles.join(', ')}` }
      });
    }

    next();
  };
}

module.exports = authorizeRoles;
