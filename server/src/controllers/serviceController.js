import Service from '../models/Service.js';
import Package from '../models/Package.js';
import Division from '../models/Division.js';

export async function getServices(req, res) {
  try {
    const { division, category, search, includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    if (division && division !== 'all') filter.division = division;
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { category: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const services = await Service.find(filter).populate('division', 'name code').sort({ name: 1 });
    return res.json({ success: true, data: services });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createService(req, res) {
  try {
    const { name, divisionId, category, description, defaultRate, unitType, taxPercentage, notes } = req.body;
    if (!name || !divisionId || !category) {
      return res.status(400).json({ success: false, message: 'Name, Division, and Category are required.' });
    }

    const service = await Service.create({
      name: name.trim(),
      division: divisionId,
      category: category.trim(),
      description: description?.trim() || '',
      defaultRate: Number(defaultRate) || 0,
      unitType: unitType?.trim() || 'service',
      taxPercentage: Number(taxPercentage) !== undefined ? Number(taxPercentage) : 18,
      notes: notes || '',
      isActive: true,
    });

    const populated = await Service.findById(service._id).populate('division', 'name code');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const updatable = ['name', 'division', 'category', 'description', 'defaultRate', 'unitType', 'taxPercentage', 'notes', 'isActive'];
    updatable.forEach((f) => {
      if (req.body[f] !== undefined) service[f] = req.body[f];
    });

    await service.save();
    const populated = await Service.findById(service._id).populate('division', 'name code');
    return res.json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Packages
export async function getPackages(req, res) {
  try {
    const { division, category } = req.query;
    const filter = { isActive: true };
    if (division && division !== 'all') filter.division = division;
    if (category && category !== 'all') filter.category = category;

    const packages = await Package.find(filter).populate('division', 'name code').populate('items.service');
    return res.json({ success: true, data: packages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createPackage(req, res) {
  try {
    const { name, divisionId, category, description, items, packagePrice } = req.body;
    if (!name || !divisionId || !packagePrice) {
      return res.status(400).json({ success: false, message: 'Name, Division, and Package Price are required.' });
    }

    const pkg = await Package.create({
      name: name.trim(),
      division: divisionId,
      category: category?.trim() || 'General',
      description: description || '',
      items: items || [],
      packagePrice: Number(packagePrice),
      isActive: true,
    });

    const populated = await Package.findById(pkg._id).populate('division', 'name code');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

