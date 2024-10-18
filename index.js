require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const recipientPhone = process.env.PHONE_TO; 
const fromPhone = process.env.PHONE_FROM; // Add the recipient's phone number


  // File to store the latest job posting ID
const lastJobIdFile = 'lastJobId.txt';

// Function to check the latest job posting
async function checkForNewJobPostings() {
  try {
    const apiUrl = 'https://api.sitewrench.com/pageparts/jobpostingmodule/250236/postings?token=2373398b7dd8a26ba45f0a19e03653bf2148b117&siteId=2332&hideExpired=true&jobCategory=86&searchTerm=&onlyApproved=true&sortBy=DateOpens&sortDesc=true&limit=100&onlyMyOrg=false&hideDeleted=true';
    const response = await axios.get(apiUrl);
    
    // Assuming the job postings are in response.data.jobs array
    const jobs = response.data.jobs;

    // Get the most recent job posting
    if (jobs.length === 0) {
      console.log('No job postings available.');
      return;
    }
    
    const latestJob = jobs[0];
    const latestJobId = latestJob.JobPostingItemId;

    // Check if there's a stored last job ID
    let lastJobId = null;
    if (fs.existsSync(lastJobIdFile)) {
      lastJobId = fs.readFileSync(lastJobIdFile, 'utf8');
    }

    if (lastJobId !== latestJobId.toString()) {
      console.log('New job posting found:', latestJob.Title);

      // Save the latest job ID to the file
      fs.writeFileSync(lastJobIdFile, latestJobId.toString());

      // Send a Twilio SMS alert
      await sendSmsAlert(latestJob);
    } else {
      console.log('No new job postings.');
    }
  } catch (error) {
    console.error('Error checking for new job postings:', error);
  }
}

// Function to send an SMS alert
async function sendSmsAlert(job) {
  const message = `New job posting: ${job.Title}\nDetails: ${job.Description.replace(/(<([^>]+)>)/gi, "")}`;
  
  try {
    await client.messages.create({
      body: message,
      from: fromPhone, // Your Twilio phone number
      to: recipientPhone,
    });
    console.log('SMS alert sent.');
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

// Function to run the job check every 12 hours (43,200,000 milliseconds)
setInterval(checkForNewJobPostings, 43200000);

// Run the check immediately when the script starts
checkForNewJobPostings();