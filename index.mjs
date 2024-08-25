const actions = require('@actions')
// import { getInput, setOutput, setFailed } from '@actions/core';
import { exec as _exec } from '@actions/exec';

const core = actions.core
const getInput = core.getInput;
const setOutput = core.setOutput;
const setFailed = core.setFailed;
async function run() {
  try {
    // Get input (including secrets) from the action.yml file
    const awsAccessKeyId = getInput('aws-access-key-id', { required: true });
    const awsSecretAccessKey = getInput('aws-secret-access-key', {
      required: true,
    });
    const awsRegion = getInput('aws-region', { required: true });
    const securityGroupId = getInput('aws-security-group-id', {
      required: true,
    });
    const port = getInput('port', { required: true });
    const toPort = getInput('to-port', { required: true });
    const protocol = getInput('protocol', { required: true });

    // Set environment variables for AWS CLI
    process.env.AWS_ACCESS_KEY_ID = awsAccessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = awsSecretAccessKey;
    process.env.AWS_DEFAULT_REGION = awsRegion;

    // Example command to add an IP to the security group (real command)
    await _exec('aws', [
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

    setOutput('result', 'Security group updated');
  } catch (error) {
    setFailed(error.message);
  }
}

run();
