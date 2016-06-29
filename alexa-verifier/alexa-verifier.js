var verifier = require('alexa-verifier');


module.exports = function(RED) {
  function alexaVerifierNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.on('input', function(msg) {
      var cert_url  = msg.req.headers.signaturecertchainurl;
      var signature = msg.req.headers.signature;
      var requestBody = msg.req.body;
      verifier(cert_url, signature, requestRawBody, function(er) {
        if (er) {
          this.error('error validating the alexa cert:', er);
          msg.res.status(401).json({ status: 'failure', reason: er });
        } else {
          this.log('successfully validated alexa');
          node.send(msg);
        }
      });
    });
  }
  RED.nodes.registerType("alexa-verifier", alexaVerifierNode);
};
