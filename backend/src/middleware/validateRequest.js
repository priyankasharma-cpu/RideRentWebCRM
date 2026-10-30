export const validateRequest =
  (schema, source = 'body') =>
  (req, _res, next) => {
    req.validated = {
      ...req.validated,
      [source]: schema.parse(req[source]),
    };
    next();
  };
