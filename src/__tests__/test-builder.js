describe('builder', () => {
    'use strict';

    const spawn = require('../spawn');

    jest.unmock('../builder');
    const builder = require('../builder');

    let p;
    pit('builds with buildData', () => {
        spawn.mockImpl(() => Promise.resolve());
 
        p = builder.build({
            build: {
                ref: 'refs/heads/master',
            },
            repository: {
                full_name: 'repo-FULL-name',
            },
        });

        return p; 
   });
});
