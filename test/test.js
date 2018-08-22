const {Builder, By, Key, until} = require("selenium-webdriver");

const driver = new Builder()
	.forBrowser("phantomjs")
	.build();

// driver.get('http://www.google.com/ncr');
// driver.findElement(By.name('q')).sendKeys("webdriver", Key.RETURN);
// driver.wait(until.titleIs("webdriver - Google Search"), 1000);

driver.get("./test/test1.html");
driver.wait(until.titleIs("Algae - Automated Testing"), 1000);

driver.quit();
