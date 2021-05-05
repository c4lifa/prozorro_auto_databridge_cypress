import {access_token} from '/cypress/constants/base.ts';
import {rll_access_token} from "/cypress/constants/base";
import rll from '/cypress/fixtures/RLL/object.json';
import {getKeys} from "../../shared/functions/keysFunc";
import {validateEmail} from "../../shared/functions/emailValidator";

const moment = require('moment');


describe('Парсинг об\'єкта реєстру до процедури LLE', () => {
    let token = null;
    let rllToken = null;
    if (Cypress.env() && Cypress.env('env')) {
        token = access_token?.[`${Cypress.env('env')}`];
    }
    if (Cypress.env() && Cypress.env('env')) {
        rllToken = rll_access_token?.[`${Cypress.env('env')}`];
    }

    it('тест', () => {
        let body = {};
        let rllBody = rll;
        //declaring dictionaries
        let dicts = [
            'relatedOrganizations.propertyOwner.identifier.scheme',
            'relatedOrganizations.currentTenant.identifier.scheme',
            'relatedOrganizations.propertyOwner.identifier.id',
            'relatedOrganizations.currentTenant.identifier.id',
            'relatedOrganizations.sellingEntity.identifier.id',
            'relatedOrganizations.sellingEntity.identifier.scheme',
            'relatedOrganizations.ownershipType',
            'relatedOrganizations.governer.identifier.id',
            'relatedOrganizations.governer.identifier.scheme',
        ];

        //reserved keys
        let reserved = [''];
        //getting dictionaries
        let uaInd = [];
        cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/classifiers/ua_identifiers`,
        }).then((res) => {
            uaInd.push(Object.keys(res?.body));
        let regions = [
            'Автономна Республіка Крим', 'Вінницька область', 'Волинська область', 'Дніпропетровська область', 'Донецька область', 'Житомирська область', 'Закарпатська область', 'Запорізька область', 'Івано-Франківська область', 'Київська область', 'Київ', 'Кіровоградська область', 'Луганська область', 'Львівська область', 'Миколаївська область', 'Одеська область', 'Полтавська область', 'Рівненська область', 'Севастополь', 'Сумська область', 'Тернопільська область', 'Харківська область', 'Херсонська область', 'Хмельницька область', 'Черкаська область', 'Чернівецька область', 'Чернігівська область'
        ];

        //deleting dict keys
        let keys = getKeys(rllBody);

            let updateObjProp = (obj, value, propPath) => {
                const [head, ...rest] = propPath.split('.');

                !rest.length
                    ? obj[head] = value
                    : updateObjProp(obj[head], value, rest.join('.'));
            }
            let randomString = function (len, bits) {
                bits = bits || 36;
                let outStr = "", newStr;
                while (outStr.length < len) {
                    newStr = Math.random().toString(bits).slice(2);
                    outStr += newStr.slice(0, Math.min(newStr.length, (len - outStr.length)));
                }
                return outStr.toUpperCase();
            };
        for (let i=0; i <= keys.length-1;i++) {
            for (let j = 0; j <= dicts.length - 1; j++) {
                if (keys[i] === dicts[j]) {
                    //deleteProp(rllBody, dicts[j]);
                    /**console.log(keys[i].split('.'))
                    if (keys[i].split('.').includes('scheme')) {
                        let rand = uaInd[(Math.floor(Math.random() * uaInd.length))][(Math.floor(Math.random() * uaInd.length))];
                        updateObjProp(rllBody, rand, keys[i]);
                        console.log(keys[i])
                        if (rand === 'UA-EDR') {
                            updateObjProp(rllBody, '12232233', keys[i].replace('.scheme', 'id'));
                        } else if (rand === 'UA-IPN') {
                            updateObjProp(rllBody, '12232233', keys[i].replace('.scheme', '.id'));
                        } else if (rand === 'UA-PASSPORT') {
                            updateObjProp(rllBody, '12232233', keys[i].replace('.scheme', '.id'));
                        } else if (rand === 'UA-ID-CARD') {
                            updateObjProp(rllBody, '12232233', keys[i].replace('.scheme', '.id'));
                        } else if (rand === 'UA-IPN-FOP') {
                            updateObjProp(rllBody, '12232233', keys[i].replace('.scheme', 'id'));
                        }
                    }**/
                }
                const getNestedObject = (nestedObj, pathArr) => {
                    return pathArr.reduce((obj, key) =>
                        (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
                }
                let arr = keys[i].split('.');
                if (!arr.includes('region') && !arr.includes('countryName')) {
                    const val = getNestedObject(rllBody, arr);
                    if (typeof val === 'string') {
                        if (!validateEmail(val)) {
                            updateObjProp(rllBody, randomString(Math.floor(Math.random() * 256)), keys[i]);
                        }
                    }
                } else if ('region' in arr){
                    updateObjProp(rllBody, regions[(Math.floor(Math.random() * regions.length))], keys[i]);
                }
            }
        }
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/registry/objects`,
            headers: {'Authorization': rllToken},
            body: {...rllBody}
        }).then((res) => {
            expect(res).to.have.property('status', 201);
            expect(res.body?.id).to.not.be.null;
            expect(res.body?.acc_token).to.not.be.null;
            let rllId = res.body?.id;
            cy.request({
                method: 'GET',
                url: `${Cypress.env('apiUrl')}/api/databridge/registry/${rllId}/legitimatePropertyLease`,
                //not right now headers: {'Authorization': `${access_token.dev}`},
            }).then((res) => {
                expect(res).to.have.property('status', 200);
                body = res.body;
                body.sellingMethod = 'legitimatePropertyLease-english-fast';
                body.auctionPeriod = {
                    "startDate": moment(new Date()).add(5, 'minutes')
                };
                body.description = {
                    "uk_UA": randomString(Math.floor(Math.random() * 256))
                };
                body.value = {
                    "currency": "UAH",
                    "amount": 1,
                    "valueAddedTaxIncluded": false
                }
                body.minimalStep = {
                    "currency": "UAH",
                    "amount": 0.1
                };
                body.tenderAttempts = 2;
                body.previousAuctionId = 'UA-PS-2021-03-09-000045-1';
                body.valuePeriod = 'month';
                body.leaseDuration = 'P2Y11M';
                body.guarantee = {
                    "currency": "UAH",
                    "amount": 2
                }
                body.registrationFee = {
                    "currency": "UAH",
                    "amount": 3000
                }
                body.bankAccounts = {
                    "advancePaymentAccounts": {
                        "accountType": "registrationFee",
                        "accounts": [
                            {
                                "currency": "UAH",
                                "accountIdentifications": [
                                    {
                                        "scheme": "UA-MFO",
                                        "id": "343434"
                                    }
                                ]
                            }
                        ]
                    }
                }
                body.items[0].registrationDetails = {};
                body.items[0].reProps.totalObjectArea = 3434;
                body.documents = [
                    {
                        "title": {
                            "uk_UA": "Назва",
                            "en_US": "Title"
                        },
                        "documentOf": "cancellation",
                        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImRzIn0.eyJpZCI6ImVlYTBiMTk4Njc1NzQ4MmZhMjQ4M2FhYTEyOGUzMmIzIiwic2NvcGUiOiJwcml2YXRlIiwiZmlsZW5hbWUiOiJhY3QuZG9jeCIsImRvY3VtZW50VHlwZSI6ImNvbnRyYWN0UHJvZm9ybWEiLCJmb3JtYXQiOiJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCIsInNoYSI6ImJlYzNkODc3OTI4NzVlYzc5N2U5OWI3ZTBhNWNiNjI2YWRiODgzOWI0NGViZGJkMGUzOWJkN2IzOTk1ZWQxMTkiLCJoYXNoIjoibWQ1OmFmNTQ5YmI1NTVhOGJkMDU3OGNmZTQ3ZTQwYTAyNWUxIiwiZGF0ZUNyZWF0ZWQiOiIyMDIxLTAyLTI1IDAwOjIxOjI1LjMxNTI4OSIsImlhdCI6MTYxNDIxMjQ4NX0.Lnuu9HYt_cfi2YmONKWR7uaLWb6Q5Ls5KnJozWOJATn-NX7ES8m3GsBLTrpG2Li97KpNauybns40CjuqgyDo1YpKWd6p9sdzAMy3OOILpDquYvExIvcfANYl-gBz6N0BqpTqwvYSDJ0oBglXvf3VIHGC5E-yPsaFVfjgdtWpURUjuSfwLKzqOwxwfbAYg1gWe4449fII_w3g4q3uSM3f6eoaNlPFauyXOSZjv_zaCwiKj9C0HG2ARQP6lL3FKawQHu5YWhvAigFWH9-nDZ8PrMyhiEAlUoU-9MgXUNATO9uataHSe48msXh_M2hY8JFjl8UXGN57uMOKjVbCvj6f3HZuZeFjtvl9TkSkLhGo8F-ngT5rz18QpUekJvUbzUx9_i0H_GAIyj5PCcNPn0UjLe1jnzCjbWvY84_Pr97COoyffPC_qa7gVmQYws5foQnMlgDo83-ziza7AP9BvKlD6tGFSexwkGmf9FsXNv9DRjkdskaSoH-cPaYSBw9AqddOA18cvYBB-w1yCxRnYYKJABp-R_1j8YgV8dvtTKpPiimS8HbaWAQuOHzXoVkRJFsoKkg1lBFQBUin6TBY3Lb00ssVQyzixvnsgp9oqcXPTgeTuR8r8bJkCWtKnG9EuGjrGE8vbFDQ4ytAfyEwkf0VOcoeFs508HmYNjAbJ2gSzFQ"
                    },
                    {
                        "title": {
                            "uk_UA": "Назва",
                            "en_US": "Title"
                        },
                        "documentOf": "cancellation",
                        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImRzIn0.eyJpZCI6IjA0ZGFkYmQ1MzVmOTQwODFiZmU3NjY1N2M0MWNhZjk4Iiwic2NvcGUiOiJwcml2YXRlIiwiZmlsZW5hbWUiOiJhY3QuZG9jeCIsImRvY3VtZW50VHlwZSI6ImlsbHVzdHJhdGlvbiIsImZvcm1hdCI6ImFwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50Iiwic2hhIjoiYmVjM2Q4Nzc5Mjg3NWVjNzk3ZTk5YjdlMGE1Y2I2MjZhZGI4ODM5YjQ0ZWJkYmQwZTM5YmQ3YjM5OTVlZDExOSIsImhhc2giOiJtZDU6YWY1NDliYjU1NWE4YmQwNTc4Y2ZlNDdlNDBhMDI1ZTEiLCJkYXRlQ3JlYXRlZCI6IjIwMjEtMDItMjUgMDA6MjI6MjUuNjY3MDY2IiwiaWF0IjoxNjE0MjEyNTQ1fQ.ogfax3_EkA5oj8I_OVPLFyYMJFEv8R7s-kB-p58se0EYcnnmXb3QkmO-FXC1wkyoMkZITeLlEfsrwu_qvmQko88Ofl9uwxiwjtAxsVUkShpwQmquyMlFneBNSuOxuKl6biRTqu3HQWgaeOPxOf1iwcAhNkZiXux7BkdIo2BfmhlhXr8ZLIqeixsAW3TDNrbleTXsobubQ7hCzE7Q0yohbZi5ztzrTx-JU8lvQyW4zwVXAYLQmBtBckePMzO9tmo4TUcHbW4_6M1wvC1SkD8rt3go2kfW81eq_xzl81hq6lCVUOg0CH0ooPUzn3aS6VfR-HJ8ydiAX_32QDLuebJvZPGjj0MQDs6P2ASU6gAByHrR5TOuVEioLvk8orHmZbK7nYtS64r3_4tg_xrI_wHnw6jbQmMX2GpYHdrOv-eRPxE0Zn-1ldAAvbgrSvCEPtB3R-rxt8jPdClgm5SS3fd4I59Hgk5wiZv-0_0wcnDZ4DNPAGQxAQ9_0x1B2v_wZWfWpn8OYi3uYTlBnjqikDMkAwcfTGISsIVsXQModuHRicL0xCT3d7AU9G_9YaMfzQUv66mnWi0MesSzDw6lwpMrMNug5VrC6LTbBAtIyvEIt21x12pAFSYwvaU71AgTkEhltf5vTWr8oY8IbqPsVCAR5_EiZVLSkykIfOgHELyGSU0"
                    },
                    {
                        "title": {
                            "uk_UA": "Назва",
                            "en_US": "Title"
                        },
                        "documentOf": "cancellation",
                        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImRzIn0.eyJpZCI6IjRhNTZiZmI3MjA3NTQzY2I4NTI4YjJjOGZmMGY5ODE4Iiwic2NvcGUiOiJwcml2YXRlIiwiZmlsZW5hbWUiOiJhY3QuZG9jeCIsImRvY3VtZW50VHlwZSI6InhfaXRlbVBsYW4iLCJmb3JtYXQiOiJhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCIsInNoYSI6ImJlYzNkODc3OTI4NzVlYzc5N2U5OWI3ZTBhNWNiNjI2YWRiODgzOWI0NGViZGJkMGUzOWJkN2IzOTk1ZWQxMTkiLCJoYXNoIjoibWQ1OmFmNTQ5YmI1NTVhOGJkMDU3OGNmZTQ3ZTQwYTAyNWUxIiwiZGF0ZUNyZWF0ZWQiOiIyMDIxLTAzLTEwIDEwOjA3OjUzLjMwNDQwNyIsImlhdCI6MTYxNTM3MDg3M30.HrtKTEZ5srvwnR5da8KsgyQ-H4CAXFx_3vbBtT-F7EGDcztuxoftUF1Ki-C1Fp1ctMP4EZbSkqGLyN0JEa-LE_-aTz57mgrGvLGRfyhUhwk98w8yPsbReRGbXpS4Eacs1Vt1FxPP1b3g2q5ekv7mp3l3zHtMoYgfKgo4ngkn7s60URpzPkqHcBGUHprpRswsNw94UutDPY4kAP5Kuua-_qaJhpU9CpYTIPFt2Hxye31fl5daXkdfScCbLl1HTZsmguYE-sVdSLD1MCZbBBmz0lrjsUB1pV8irOyRL4-WDG-5glcZqvFITiUh7A-p0lGtgszZerIIajty2-1Ds_a6yrhf0K9IU8vjYrRqoxpa9vb_GhzVd8UjdX1yUj2t_KjQ3BgsHDfRiSjxkOmgMpua0JwjgSQk3vFYOcX0poybDugEOwn1-a_rwIZj4JSq5QBXu0d9PpopqsujFGoemiexK28pWA7Ntm3efoOKhhXmawQ9yFklN68aFV36q6qb3AbXhcW1vXg0RTabWvyNLdpmsEcFjtZMCxvQxwoJZtvxK1496mS6AL0Dny47ln4tuJ1EnnaWG_1sYAzi0--9R2naf7Y5uYBDnLDHgNgrkAWfJJXRHgP5TTH1gYAipn16jCsyluJ1XdwxOGjoRmID-Z97epN0LH1LUFtOU9QBA1p_K_8"
                    }
                ];
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
});