browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received request: ", request);

  if (request.greeting === "hello") sendResponse({ farewell: "goodbye" });
});

browser.webNavigation.onCommitted.addListener((details) => {
  console.log(details);
});

console.log("Protokolibri background.js started");
