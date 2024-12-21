import { readFileSync } from 'fs';

let usersData;
let userIndex = 0;

function loadUserData(userContext, events, done) {
  try {
    // Load data only once and cache it    
    if (!usersData) {
      usersData = JSON.parse(readFileSync('./data/chat-users.json', 'utf-8'));
    }
    // console.log(`user data : ${JSON.stringify(usersData)}`);

    // Cycle through users in the data file
    const user = usersData[userIndex % usersData.length];
    userIndex++;
    // Set user data directly without login (since we have tokens in JSON)
    // userContext.vars.userId = user.userId;
    // userContext.vars.token = user.token;
    // userContext.vars.roomId = user.roomId;

        // Ensure these match your DTO requirements
    userContext.vars = {
      userId: user.userId,
      token: `Bearer ${user.token}`,
      socketToken: user.token,
      roomId: user.roomId,
      createChatDto: {  // Add DTO format
        userId: user.userId,
        roomId: user.roomId,
        content: "Test message"
      }
    };

    // console.log(`Loaded user data: ${JSON.stringify(user.userId)}`);
    // console.log(`Loaded user data: ${JSON.stringify(user.token)}`);
    // console.log(`Loaded user data: ${JSON.stringify(user.roomId)}`);

    return done();
  } catch (error) {
    console.error('Error in loadUserData:', error.message);
    return done(error);
  }
}

export { loadUserData };