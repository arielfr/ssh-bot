/**
 * Created by arey on 11/14/17.
 */
const node_ssh = require('node-ssh');

ssh = new node_ssh();

ssh.connect({
  host: '13.84.178.228',
  user: 'ubuntu',
  privateKey: '/Users/arey/.ssh/patas.pem',
}).then(() => {
  ssh.execCommand('cat .bashrc').then(function(result) {
    console.log('STDOUT: ' + result.stdout)
    console.log('STDERR: ' + result.stderr)

    ssh.dispose();
  });
});