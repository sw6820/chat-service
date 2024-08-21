const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
  try {
    // Get input from the action.yml file
    const awsAccessKeyId = core.getInput('aws-access-key-id');
    const awsSecretAccessKey = core.getInput('aws-secret-access-key');
    const awsRegion = core.getInput('aws-region');
    const securityGroupId = core.getInput('aws-security-group-id');
    const port = core.getInput('port');
    const toPort = core.getInput('to-port');
    const protocol = core.getInput('protocol');

    // Example command to add an IP to the security group (pseudo-code)
    await exec.exec('aws', [
      'ec2',
      'authorize-security-group-ingress',
      '--group-id',
      securityGroupId,
      '--protocol',
      protocol,
      '--port',
      port,
      '--cidr',
      '0.0.0.0/0',
    ]);

    core.setOutput('result', 'Security group updated');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
