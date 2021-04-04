# send-to-allure-server-action

Compresses allure-results, sends to [kochetkov-ma/allure-server](https://github.com/kochetkov-ma/allure-server) , and triggers allure report generation on it. Result of this action - is URL to generated report.


Works for any test project languages (java, .net, js/ts, python, etc), 
for any testing frameworks (junit, pytest, cucumber, mocha, jest ...) 
that has allure reporter configured.


## Inputs

### `allure-server-url`

**Required** Full url of your deployed allure-server
______
### `path`
Use this option to group test reports. All reports with same `path` will have common allure history. Also it used as url path to access latest report. You can specify branch name here, or project name. 

Default - your repo name
______
### `username`
If your allure-server has basic auth enabled, specify username here
______
### `password`
If your allure-server has basic auth enabled, specify password here
______
### `allure-results`
Path to your allure-results folder. This folder will be sent to server. 

Default - `./allure-results`


## Outputs

### `report-url`

URL of generated Allure report.


## Example usage
```yml
    - name: Send Results and Generate Allure Report
      uses: Xotabu4/send-to-allure-server-action@1
      # always() needed because we want report for failed tests as well
      if: ${{ always() }}
      with:
        allure-server-url: 'http://my-allure-server.com:5001/'
```
