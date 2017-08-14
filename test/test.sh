#!/usr/bin/env bash

# search for all files named output_.txt to base our tests on
TEST_FILES=$(ls test*.html 2>/dev/null)
if [[ -z "${TEST_FILES}" ]]
	then
		printf "No test files found!\nExiting...\n"
		exit 1
fi

for TEST_FILE in ${TEST_FILES}
do
	#TEST_NUMBER=$(echo ${TEST_FILE} | sed "s/output\(.*\).txt/\1/")
	RAW_NAME=$(echo ${TEST_FILE} | sed "s/\(.*\).html/\1/")

	# Check for the corresponding
	OUTPUT_FILE="${RAW_NAME}_output.txt"
	if [[ ! -f "${OUTPUT_FILE}" ]]
		then
			printf "Corresponding output file to ${TEST_FILE} not found!\nExiting...\n"
			exit 1
	fi

	DOM_OUTPUT=$(google-chrome --headless --disable-gpu --dump-dom file://${PWD}/${TEST_FILE});
	EXPECTED_OUTPUT=$(cat ${OUTPUT_FILE})

	if [[ "${DOM_OUTPUT}" == "${EXPECTED_OUTPUT}" ]]
		then printf "Test ${TEST_FILE}: PASSED.\n"
		else
			printf "Test ${TEST_FILE}: FAILED.\nTests unsuccessful.\nExiting...\n"
			exit 1
	fi
done
printf "All tests passed!\n"
