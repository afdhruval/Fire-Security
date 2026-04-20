const Contract = require('../models/Contract');

// @desc  Get all contracts
// @route GET /api/v1/contracts
exports.getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate('client', 'clientName companyName email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: contracts.length, data: contracts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single contract
// @route GET /api/v1/contracts/:id
exports.getContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('client', 'clientName companyName email phone');
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create contract
// @route POST /api/v1/contracts
exports.createContract = async (req, res) => {
  try {
    const contract = await Contract.create(req.body);
    // Populate before returning so frontend gets client name immediately
    await contract.populate('client', 'clientName companyName email phone');
    res.status(201).json({ success: true, data: contract });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update contract
// @route PUT /api/v1/contracts/:id
exports.updateContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('client', 'clientName companyName email phone');
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, data: contract });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete contract
// @route DELETE /api/v1/contracts/:id
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findByIdAndDelete(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, message: 'Contract deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};