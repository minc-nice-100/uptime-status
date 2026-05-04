// Configuration
window.Config = {

  // Display title
  SiteName: 'Ited Blog Status Page',

  // API keys are handled on the backend
  ApiKeys: [],

    // Log days
  // Although the free version claims to save logs for only 60 days, testing shows API can retrieve 90 days
  // However, don't set the time too long as it may cause lag and API requests may fail
  CountDays: 90,

  // Whether to show links to monitored sites
  ShowLink: true,

  // Navigation menu
  Navi: [
    {
      text: 'Blog',
      url: 'https://itedev.com/'
    }
  ],
};