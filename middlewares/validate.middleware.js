import { BadRequestError } from '../utils/errors.js';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      return next(new BadRequestError(`Validation Failed: ${details}`));
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const details = error.details.map(d => d.message).join(', ');
      return next(new BadRequestError(`Params Validation Failed: ${details}`));
    }

    req.params = value;
    next();
  };
};
