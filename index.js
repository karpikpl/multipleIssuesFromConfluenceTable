

getConfluenceDataAsync(confluencePage)
    .then((res) => {

        if (res.data.results.length != 1) {
            throw `Confluence data not found - check if confluence Page title: '${confluencePage}' is correct`;
        }

        const confluenceResponse = res.data.results[0];
        let itemsToAdd = parseXml(confluenceResponse.body.view.value);

        console.log(`Parsed items for ${confluencePage}`);
        console.log(itemsToAdd);

        if (!DEBUG) {
            let jiras = itemsToAdd.map(item => createJira(item).then((res) => {
                console.log(`Created jira: ${res.data.key}`);
                item.key = res.data.key;
                return createRemoteLink(res.data.key)
            }));

            return Promise.all(jiras)
            .then((res) => {

                console.log(`All items processed ${res.length}`);
                const jiraMap = itemsToAdd.reduce((map, cur) => {

                    map[cur.id] = cur.key;
                    return map;
                }, {})

                const updatedPage = updateXml(confluenceResponse.body.storage.value, jiraMap);
                console.log(updatedPage);

                confluenceResponse.body.storage.value = updatedPage;
                delete confluenceResponse.body.view;
                confluenceResponse.version.number = confluenceResponse.version.number + 1;
                confluenceResponse.version.message = 'Updated by Jira-from-Confluence tool';

                console.log(JSON.stringify(confluenceResponse));

                return postConfluenceDataAsync(confluenceResponse.id, JSON.stringify(confluenceResponse));
            });
        }
    })
    .then((res) => console.log(res))
    .catch((err) => console.error(err));
