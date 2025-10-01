// This file is deprecated - completion is now handled by the Language Server Protocol (LSP)
// See src/extension.js and src/server.js for the new implementation

// Legacy completion provider - kept for backward compatibility
// The main extension now uses LSP for much better completion
function activate(_context) {
    console.log('Legacy completion provider loaded - LSP provides better completion now');
}

exports.activate = activate;
