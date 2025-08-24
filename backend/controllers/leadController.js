const Lead = require('../models/Lead');

// Build filters based on query params
function buildFilters(q) {
  const filter = {};
  // Strings: equals, contains
  if (q.email) filter.email = q.email;
  if (q.email_contains) filter.email = { $regex: q.email_contains, $options: 'i' };
  if (q.company) filter.company = q.company;
  if (q.company_contains) filter.company = { $regex: q.company_contains, $options: 'i' };
  if (q.city) filter.city = q.city;
  if (q.city_contains) filter.city = { $regex: q.city_contains, $options: 'i' };
  // Enums: equals, in
  if (q.status) filter.status = q.status;
  if (q.status_in) filter.status = { $in: Array.isArray(q.status_in) ? q.status_in : String(q.status_in).split(',') };
  if (q.source) filter.source = q.source;
  if (q.source_in) filter.source = { $in: Array.isArray(q.source_in) ? q.source_in : String(q.source_in).split(',') };
  // Numbers: equals, gt, lt, between
  if (q.score) filter.score = Number(q.score);
  if (q.score_gt) filter.score = { ...(filter.score || {}), $gt: Number(q.score_gt) };
  if (q.score_lt) filter.score = { ...(filter.score || {}), $lt: Number(q.score_lt) };
  if (q.score_between) {
    const [min, max] = String(q.score_between).split(',').map(Number);
    filter.score = { $gte: min, $lte: max };
  }
  if (q.lead_value) filter.lead_value = Number(q.lead_value);
  if (q.lead_value_gt) filter.lead_value = { ...(filter.lead_value || {}), $gt: Number(q.lead_value_gt) };
  if (q.lead_value_lt) filter.lead_value = { ...(filter.lead_value || {}), $lt: Number(q.lead_value_lt) };
  if (q.lead_value_between) {
    const [min, max] = String(q.lead_value_between).split(',').map(Number);
    filter.lead_value = { $gte: min, $lte: max };
  }
  // Dates: on, before, after, between
  const dateField = (name) => {
    const on = q[`${name}_on`];
    const before = q[`${name}_before`];
    const after = q[`${name}_after`];
    const between = q[`${name}_between`];
    if (on) filter[name] = { $gte: new Date(on), $lt: new Date(new Date(on).getTime() + 24*60*60*1000) };
    if (before) filter[name] = { ...(filter[name] || {}), $lt: new Date(before) };
    if (after) filter[name] = { ...(filter[name] || {}), $gt: new Date(after) };
    if (between) {
      const [from, to] = String(between).split(',');
      filter[name] = { $gte: new Date(from), $lte: new Date(to) };
    }
  };
  dateField('created_at');
  dateField('last_activity_at');
  // Boolean: equals
  if (q.is_qualified !== undefined) filter.is_qualified = q.is_qualified === 'true' || q.is_qualified === true;

  return filter;
}

exports.createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    return res.status(201).json(lead.toJSON());
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Email must be unique' });
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const filter = buildFilters(req.query);

    const total = await Lead.countDocuments(filter);
    const docs = await Lead.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Use toJSON transform to ensure `id` is present and `_id` removed
    const data = docs.map((d) => d.toJSON());
    return res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Not found' });
    return res.json(lead.toJSON());
  } catch (e) {
    return res.status(404).json({ message: 'Not found' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: 'Not found' });
    return res.json(lead.toJSON());
  } catch (e) {
    return res.status(400).json({ message: 'Invalid data' });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Not found' });
    return res.status(204).send();
  } catch (e) {
    return res.status(404).json({ message: 'Not found' });
  }
};
