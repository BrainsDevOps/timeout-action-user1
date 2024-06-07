# Workflow cleaner action
Checks for all running jobs in the past X days and cancels any jobs that had been running for more than a specified timeout.

## Inputs
* app-id: The App Id from the Github App used to query the Github API across the repositories
  * The Github App need to be installed on the monitored repositories
  * The app needs the following permissions
    * Read access to metadata
    * Read and write access to actions
* app-pk: The private key associated to the Github App
* scan-range-days: The number of days used to query for ongoing jobs
* timeout-minutes: The number of minutes after we consider that a job should be cancelled

## Outputs
* report: A markdown table containing information about the changes done by the process
  * Repository
  * Workflow title
  * Run number: The run number (used friendly number for the run - order inside the repo)
  * Run Id: Technical Id of the run
  * Elapsed time s: The time that has passed since the job started
  * Was stopped: Boolean value that informs whether the job could actually be stopped

## Modifying the code
If the javascript code in the action is modified, the dist folder needs to be rebuilt with @vercel/ncc. Use the `npm run build` script

## Local testing
you can test the code locally by defining your Github appId and private key in the a .env file. And example of the expected properties can be found in .env.example