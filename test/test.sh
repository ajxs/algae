#!/usr/bin/env bash

# search for all files named output_.txt to base our tests on
TEST_FILES=$(ls output*.txt 2>/dev/null)
if [[ -z "${TEST_FILES}" ]]
	then
		printf "No test files found!\nExiting...\n"
		exit 1
fi

for TEST_FILE in ${TEST_FILES}
do
	TEST_NUMBER=$(echo ${TEST_FILE} | sed "s/output\(.*\).txt/\1/")

	# Check for the corresponding
	TEMPLATE_FILE="test${TEST_NUMBER}.html"
	if [[ ! -f "${TEMPLATE_FILE}" ]]
		then
			printf "Corresponding template file to ${TEST_FILE} not found!\nExiting...\n"
			exit 1
	fi

	DOM_OUTPUT=$(google-chrome --headless --disable-gpu --dump-dom file://${PWD}/${TEMPLATE_FILE});
	EXPECTED_OUTPUT=$(cat ${TEST_FILE})

	if [[ "${DOM_OUTPUT}" == "${EXPECTED_OUTPUT}" ]]
		then printf "Test ${TEST_NUMBER}: PASSED.\n"
		else
			printf "Test ${TEST_NUMBER}: FAILED.\nTests unsuccessful.\nExiting...\n"
			exit 1
	fi
done
printf "All tests passed!\n"
