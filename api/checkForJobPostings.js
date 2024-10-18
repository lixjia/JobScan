const axios = require('axios');
const fs = require('fs');
const twilio = require('twilio');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const recipientPhone1 = process.env.PHONE_TO1;
const recipientPhone2 = process.env.PHONE_TO2;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const lastJobIdFile = '/tmp/lastJobId.txt'; // Temporary storage in Vercel

export default async function  checkForNewJobPostings(req, res) {
  try {
    const apiUrl = 'https://api.sitewrench.com/pageparts/jobpostingmodule/250236/postings?token=2373398b7dd8a26ba45f0a19e03653bf2148b117&siteId=2332&hideExpired=true&jobCategory=86&searchTerm=&onlyApproved=true&sortBy=DateOpens&sortDesc=true&limit=100&onlyMyOrg=false&hideDeleted=true';
    const response = await axios.get(apiUrl);
    
    const jobs = response.data.jobs;

    if (jobs.length === 0) {
      console.log('No job postings available.');
      return res.status(200).json({ message: 'No job postings available.' });
    }

    const latestJob = jobs[0];
    const latestJobId = latestJob.JobPostingItemId;

    let lastJobId = null;
    if (fs.existsSync(lastJobIdFile)) {
      lastJobId = fs.readFileSync(lastJobIdFile, 'utf8');
    }

    if (lastJobId !== latestJobId.toString()) {
      console.log('New job posting found:', latestJob.Title);
      fs.writeFileSync(lastJobIdFile, latestJobId.toString());
      await sendSmsAlert(latestJob);
      return res.status(200).json({ message: 'New job posting found and SMS sent.' });
    } else {
      console.log('No new job postings.');
      return res.status(200).json({ message: 'No new job postings.' });
    }
  } catch (error) {
    console.error('Error checking for new job postings:', error);
    return res.status(500).json({ error: 'Error checking for job postings.' });
  }
}

async function sendSmsAlert(job) {
  const message = `New job posting: ${job.Title}\nDetails: ${job.Description.replace(/(<([^>]+)>)/gi, "")}\nVisit: https://www.aza.org/jobs`;
  
  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: recipientPhone1,
    });
    await client.messages.create({
        body: message,
        from: fromPhone,
        to: recipientPhone2,
      });
    console.log('SMS alert sent.');
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

module.exports = checkForNewJobPostings;
