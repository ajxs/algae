"use strict";

const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const assert = require("assert");

const fixString = s => s.trim().replace(/[\n\s]/ig, "");
const testCases = [{
	template: "template1.html",
	output: "output1.txt"
}];

testCases.forEach(testCase => {
	let outputFileContents = fs.readFileSync(path.resolve(__dirname, testCase.output), {
		encoding: "utf8"
	});

	let templateFilePath = `file://${path.resolve(__dirname, testCase.template)}`;
	let testProcess = child_process.spawn("google-chrome",
		["--headless", "--disable-gpu", "--dump-dom", `${templateFilePath}`]);

	testProcess.stdout.on("data", data => {
		assert.ok(fixString(data.toString()) == fixString(outputFileContents), "DOM tests unsuccessful!");
		console.log("DOM tests successful");
	});
});
