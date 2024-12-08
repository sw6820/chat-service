import { ConfigService } from '@nestjs/config';
import configuration from '../configs/configuration';

async function checkConfig() {
  const configService = new ConfigService(configuration());
  
  console.log('Database Configuration:');
  console.log('Host:', configService.get('DATABASE_HOST'));
  console.log('Port:', configService.get('DATABASE_PORT'));
  console.log('Username:', configService.get('DATABASE_USERNAME'));
  console.log('Database:', configService.get('DATABASE_NAME'));
  console.log('Environment:', process.env.NODE_ENV);
}

checkConfig().catch(console.error);
