const BASE_URL = 'https://data.sncf.com/api/records/1.0/search/'

const req = async (dataset, facets, refine) => {
	const facetString = `facet=${facets.join('&facet=')}`
	const datasetString = `dataset=${dataset}`
	const refineString = Object.keys(refine).map(facet =>
		`refine.${facet}=${refine[facet]}`
	).join('&')

	const response = await fetch(`${BASE_URL}?${datasetString}&${facetString}&${refineString}&rows=100`)
	const json = await response.json()

	return json['records']
}

const daysFromNow = days => new Date(_.now() + days * 1000 * 60 * 60 * 24)

const app = new Vue({
	el: '#app',
	data: {
		localisation: 'PARIS (intramuros)',
		startDate: daysFromNow(3),
		endDate: daysFromNow(5),
		departureCount: 0,
		arrivalCount: 0
	},
	asyncComputed: {
		departureHash: {
			async get() {
				if (_.isNil(this.startDate)) return {}

				const request = req('tgvmax', ['origine', 'destination', 'date', 'od_happy_card'], {
					date: this.startDate,
					origine: this.localisation,
					od_happy_card: 'OUI'
				})

				const list = await request

				this.departureCount = list.length

				return _.reduce(list, (hash, {fields}) => {
					if (hash[fields.destination] == null) hash[fields.destination] = []
					hash[fields.destination].push(_.pick(fields, 'heure_depart', 'heure_arrivee', 'origine', 'destination'))
					return hash
				}, {})
			},
			default: {}
		},
		arrivalHash: {
			async get() {
				if (_.isNil(this.endDate)) return {}

				const request = req('tgvmax', ['origine', 'destination', 'date', 'od_happy_card'], {
					date: this.endDate,
					destination: this.localisation,
					od_happy_card: 'OUI'
				})

				const list = await request

				this.arrivalCount = list.length

				return _.reduce(list, (hash, {fields}) => {
					if (hash[fields.origine] == null) hash[fields.origine] = []
					hash[fields.origine].push(_.pick(fields, 'heure_depart', 'heure_arrivee', 'origine', 'destination'))
					return hash
				}, {})
			},
			default: {}
		}
	},
	computed: {
		destinations() {
			return Object.keys(this.arrivalHash).filter(k => k in this.departureHash).sort()
		}
	}
})
