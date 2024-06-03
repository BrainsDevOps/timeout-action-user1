import {App} from 'octokit'
import moment from "moment"
import fs from 'node:fs'
import 'dotenv/config'
import core from '@actions/core'

// Default on environment variables for local testing (read from .env file)
const appId = core.getInput('app-id') || process.env.GHA_WORKFLOWS_CLEANER_APP_ID
const privateKey = core.getInput('client-pk') || process.env.GHA_WORKFLOWS_CLEANER_PRIVATE_KEY

const app = new App({appId, privateKey});

// const STOPPABLE_STATES = ['in_progress']
const STOPPABLE_STATES = ['completed']
const TIMEOUT_IN_SECS = 1
const HEADERS = {
    headers: {
        'X-GitHub-Api-Version': '2022-11-28'
    }
}
// const { data } = await app.octokit.request("/app");
// console.log("authenticated as %s", data.name);
const now = Date.now()
const twoDaysAgo = moment().subtract(2, 'days').format("YYYY-MM-DD")

const REPORT_HEADERS = ["Repository", "Workflow Title", "Run number", "Run Id", "Elapsed time s", "Was stopped"]
const csvReport = [REPORT_HEADERS]

for await (const { installation } of app.eachInstallation.iterator()) {
    for await (const { octokit, repository } of app.eachRepository.iterator({
        installationId: installation.id,
    })) {
        console.log(`Working on ${repository.full_name}`)
        let runs = await octokit.request(`GET /repos/${repository.full_name}/actions/runs`, {
            per_page: 100,
            created: `>${twoDaysAgo}`,
            ...HEADERS
        })
        const stoppableRuns = runs.data.workflow_runs
            .filter(run=> STOPPABLE_STATES.includes(run.status))
            .map(run => {
                return {
                    repository_fullname: repository.full_name,
                    display_title: run.display_title,
                    run_number: run.run_number,
                    id: run.id,
                    elapsedTimeInSeconds: moment.duration(now - Date.parse(run.run_started_at)).asSeconds()
                }
            })
            .filter( run => run.elapsedTimeInSeconds > TIMEOUT_IN_SECS)
        console.log(stoppableRuns)
        // for(let j=0; j < stoppableRuns.length; j++) {
        //     let stoppableRun = stoppableRuns[j]
        //     try {
        //         let result  = await octokit.request(`POST /repos/${repository.full_name}/actions/runs/${stoppableRun.id}/cancel`, {...HEADERS})
        //         csvReport.push([stoppableRun.repository_fullname, stoppableRun.display_title, stoppableRun.run_number, stoppableRun.id, stoppableRun.elapsedTimeInSeconds, true])
        //         console.log(result)
        //     }
        //     catch  (error) {
        //         console.error(error)
        //         csvReport.push([stoppableRun.repository_fullname, stoppableRun.display_title, stoppableRun.run_number, stoppableRun.id, stoppableRun.elapsedTimeInSeconds, false])
        //     }
        // }
    }
}

try {
    fs.writeFileSync('report.csv', csvReport.map(e => e.join(",")).join("\n"));
    // file written successfully
} catch (err) {
    console.error(err);
}