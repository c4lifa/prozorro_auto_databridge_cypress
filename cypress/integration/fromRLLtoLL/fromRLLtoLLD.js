import {access_token} from '/cypress/constants/base.ts';
import rll from '/cypress/fixtures/RLL/object.json';
import { getKeys } from "../../shared/functions/keysFunc";

const moment = require('moment');


describe('Парсинг об\'єкта реєстру до процедури LLE', () => {
    let token = null;
    if (Cypress.env() && Cypress.env('env')) {
        token = access_token?.[`${Cypress.env('env')}`];
    }


    it('тест', () => {
        let body = {};
        let rllBody = rll;
        //declaring dictionaries
        let dicts = ['title.uk_UA'];

        //reserved keys
        let reserved = [''];
        //getting dictionaries

        //deleting dict keys
        let keys = getKeys(rllBody);
        console.log(keys);
        for (let i=0; i <= keys.length-1;i++) {
            for (let j = 0; j <= dicts.length - 1; j++) {
                if (keys[i] === dicts[j]) {
                    console.log('sxdfs')
                    delete rllBody[`${dicts[i]}`];
                }
            }
        }
        console.log(rllBody)
        //testBody randomization
        let auctionPeriod = {
            "startDate": moment(new Date()).add(5, 'minutes')
        };
        let value = {
            "currency": "UAH",
            "amount": 1,
            "valueAddedTaxIncluded": false
        }
        body.value = value;
        body.auctionPeriod = auctionPeriod;
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/registry/objects`,
            headers: {'Authorization': token},
            body: {...rllBody}
        }).then((res) => {
            expect(res).to.have.property('status', 201);
            expect(res.body?.id).to.not.be.null;
            expect(res.body?.acc_token).to.not.be.null;
            let rllId = res.body?.id;
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/api/databridge/registry/${id}/legitimatePropertyLease`,
                //not right now headers: {'Authorization': `${access_token.dev}`},
            }).then((res) => {
                expect(res).to.have.property('status', 200);
                expect(res.body?.id).to.not.be.null;
                expect(res.body?.acc_token).to.not.be.null;
                cy.request({
                    method: 'POST',
                    url: `${Cypress.env('apiUrl')}/api/procedures`,
                    headers: {'Authorization': token},
                    body: {...body}
                }).then((res) => {
                    let proc_id = res.body?.id;
                    let proc_acc_token = res.body?.acc_token;
                    cy.request({
                        method: 'GET',
                        url: `${Cypress.env('apiUrl')}/api/procedures/${proc_id}?acc_token=${proc_acc_token}`
                    }).then((res) => {
                        expect(res.body).to.not.be.null;
                    });
                });
                });
        });
    });
});