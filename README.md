# send-to-allure-server-action

Compresses allure-results, sends to kochetkov-ma/allure-server , and triggers allure report generation.

Works for any test project languages (java, .net, js/ts, python, etc), for any testing frameworks (junit, pytest, cucumber, mocha, jest ...) that has allure reporter configured.


## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

uses: actions/hello-world-javascript-action@v1.1
with:
who-to-greet: 'Mona the Octocat'
