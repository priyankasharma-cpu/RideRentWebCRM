export const authorize = (role) => (req, res, next) => {
  if (req.user?.role !== role)
    return res.status(403).json({
      error: 'Administrator access required.',
    });
  next();
};
