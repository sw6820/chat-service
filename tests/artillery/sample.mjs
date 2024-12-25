import axios from 'axios';

const API_URL = 'https://api.stahc.uk';
const email = 'a@a.com';
const password = '1';
const login = await axios.post(`${API_URL}/auth/login`, { email, password });
//   return response.data.access_token;
// console.log(`res keys : ${Object.keys(response.data)}`);
const token = login.data.access_token;
// const response = await axios.get(`${API_URL}/users/friends`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
// console.log(`response : ${JSON.stringify(response.data.friends)}`);

// console.log(`status : ${response.data.status}`);
// console.log(`access_token : ${response.data.access_token}`);
// console.log(`message: ${response.data.message}`);
const response = await axios.get(`${API_URL}/users/getUserSecure/${email}`);
// console.log(`secure`)
console.log(`response : ${JSON.stringify(response.data)}`);
