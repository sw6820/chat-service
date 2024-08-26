import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function run() {
  try {
    // Get input (including secrets) from the action.yml file
    const awsAccessKeyId = core.getInput('aws-access-key-id', {
      required: true,
    });
    const awsSecretAccessKey = core.getInput('aws-secret-access-key', {
      required: true,
    });
    const awsRegion = core.getInput('aws-region', { required: true });
    const securityGroupId = core.getInput('aws-security-group-id', {
      required: true,
    });
    const port = core.getInput('port', { required: true });
    const toPort = core.getInput('to-port', { required: true });
    const protocol = core.getInput('protocol', { required: true });

    // Set environment variables for AWS CLI
    process.env.AWS_ACCESS_KEY_ID = awsAccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = awsSecretAccessKey;
    process.env.AWS_DEFAULT_REGION = awsRegion;

    // Example command to add an IP to the security group (real command)
    await exec('aws', [
      'ec2',
      'authorize-security-group-ingress',
      '--group-id',
      securityGroupId,
      '--protocol',
      protocol,
      '--port',
      port,
      '--cidr',
      '0.0.0.0/0', // In real use, replace this with the actual CIDR block
    ]);

    core.setOutput('result', 'Security group updated');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
