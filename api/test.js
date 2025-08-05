module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Serverless function is working',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};