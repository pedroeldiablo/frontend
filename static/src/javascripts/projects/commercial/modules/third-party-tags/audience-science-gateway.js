import config from 'common/utils/config';
const audienceScienceGatewayUrl = '//js.revsci.net/gateway/gw.js?csid=F09828&auto=t&bpid=theguardian';

export default {
    shouldRun: config.page.edition === 'UK' && config.switches.audienceScienceGateway,
    url: audienceScienceGatewayUrl,
};
