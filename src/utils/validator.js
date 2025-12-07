// small helper for basic checks
exports.isEmpty = (v) => v === undefined || v === null || v === '';

exports.requireFields = (obj, fields) => {
  const missing = [];
  fields.forEach((f) => { if (exports.isEmpty(obj[f])) missing.push(f); });
  return missing;
};
