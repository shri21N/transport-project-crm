/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'dispatcher', 'driver')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource. Required roles: [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

export default authorize;
