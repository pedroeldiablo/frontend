/* global google*/
import fetchJson from 'common/utils/fetch-json';
import groupBy from 'lodash/collections/groupBy';
import flatten from 'lodash/arrays/flatten';
import pluck from 'lodash/collections/pluck';
import first from 'lodash/arrays/first';
import last from 'lodash/arrays/last';
import values from 'lodash/objects/values';

function initialise() {
    // riff raff - requires you to be on the guardian network
    const apiKey = document.getElementById('riffraff-api-key').value;
    const callback = `stupidJSONP${Math.floor(Math.random() * 1000)}`;
    window[callback] = function (deployments) {
        // a hash of the last deployment each project
        const latestDeployments = {
            CODE: {},
            PROD: {},
        };
        deployments.response.results.filter(deployment => deployment.projectName.indexOf('dotcom:') === 0).forEach((deploy) => {
            const project = deploy.projectName;
            const stage = deploy.stage;
            if (stage && latestDeployments[stage] && !latestDeployments[stage].hasOwnProperty(project)) {
                latestDeployments[stage][project] = deploy;
            }
        });

        function renderDeployer(stage, revision, deployer) {
            const targetId = `${stage}-${revision}`;

            if (!document.getElementById(targetId)) {
                const list = document.getElementById(`deployers${stage}`);
                const li = document.createElement('li');
                li.setAttribute('id', targetId);
                list.appendChild(li);
                fetchJson(`//${location.host}/radiator/commit/${revision}`).then(
                    (rev) => {
                        if (rev.commit) {
                            li.innerHTML = `${rev.commit.author.name} <small>(deployed by ${deployer})</small>`;
                        }
                    }
                );
            }
        }

        function renderDeploys(stage, target) {
            const sortedDeployments = Object.keys(latestDeployments[stage])
                .sort((firstDeployment, secondDeployment) => {
                    // sorting by build number (higher first) and then project name (alphabetical)
                    const d1 = latestDeployments[stage][firstDeployment];
                    const d2 = latestDeployments[stage][secondDeployment];
                    const buildDiff = d1.build - d2.build;
                    if (buildDiff !== 0) {
                        return buildDiff;
                    }
                    return d1.projectName.localeCompare(d2.projectName);
                });

            sortedDeployments.forEach((deployment) => {
                const d = latestDeployments[stage][deployment];
                const nameAbbreviation = d.projectName.substr(7, 4); // start at 7 to drop 'dotcom: '

                const link = document.createElement('a');
                link.href = `https://riffraff.gutools.co.uk/deployment/view/${d.uuid}`;
                link.innerHTML = `${nameAbbreviation} ${d.build}`;

                const li = document.createElement('li');
                li.className = d.status;
                li.setAttribute('title', d.projectName);
                li.appendChild(link);

                if (latestDeployments.CODE[deployment] && stage === 'PROD' && d.status === 'Completed') {
                    const codeBuild = (latestDeployments.CODE[deployment] || {}).build;
                    if (codeBuild !== d.build) {
                        li.className = 'Behind';
                    }
                }

                if (d.status !== 'Completed') {
                    renderDeployer(stage, d.tags.vcsRevision, d.deployer);
                }

                target.appendChild(li);
            });
        }
        renderDeploys('CODE', document.getElementById('riffraffCODE'));
        renderDeploys('PROD', document.getElementById('riffraffPROD'));
    };
    const jsonpScript = document.createElement('script');
    jsonpScript.src = `https://riffraff.gutools.co.uk/api/history?${[
        `projectName=dotcom${encodeURIComponent(':')}`,
        `key=${apiKey}`,
        'pageSize=200',
        `callback=${callback}`,
    ].join('&')}`;
    document.body.appendChild(jsonpScript);


    // Page views
    fetchJson(`//${location.host}/ophan/pageviews`).then(
        (data) => {
            const todayData = groupBy(flatten(pluck(data.seriesData, 'data')),
                entry => entry.dateTime
            );

            // Remove first & last Ophan entries, as they always seem slightly off
            const keys = Object.keys(todayData);
            delete todayData[first(keys)];
            delete todayData[last(keys)];

            // Build Graph
            const graphData = [
                ['time', 'pageviews'],
            ];

            Object.keys(todayData).reduce((graphData, timestamp) => {
                let epoch = parseInt(timestamp, 10),
                    time = new Date(epoch),
                    hours = (`0${time.getHours()}`).slice(-2),
                    mins = (`0${time.getMinutes()}`).slice(-2),
                    formattedTime = `${hours}: ${mins}`,
                    totalViews = todayData[timestamp].reduce((memo, entry) => entry.count + memo, 0);

                graphData.push([formattedTime, totalViews]);
                return graphData;
            }, graphData);

            new google.visualization.LineChart(document.getElementById('pageviews'))
                .draw(google.visualization.arrayToDataTable(graphData), {
                    title: 'Page views',
                    backgroundColor: '#fff',
                    colors: ['#e6711b'],
                    height: 160,
                    legend: 'none',
                    fontName: 'Georgia',
                    titleTextStyle: {
                        color: '#999',
                    },
                    hAxis: {
                        textStyle: {
                            color: '#ccc',
                        },
                        gridlines: {
                            count: 0,
                        },
                        showTextEvery: 15,
                        baselineColor: '#fff',
                    },
                    smoothLine: true,
                    chartArea: {
                        width: '85%',
                    },
                });

            // Average pageviews now
            const lastOphanEntry = last(values(todayData)).reduce((memo, entry) => entry.count + memo, 0);
            const viewsPerSecond = Math.round(lastOphanEntry / 60);
            document.querySelector('.pageviews-per-second').textContent = `(${viewsPerSecond} views/sec)`;
        }
    );
}

export default {
    init: initialise,
};
