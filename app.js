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

const app = new Vue({
	el: '#app',
	data: {
		startDate: "2018-07-28",
		endDate: "2018-07-29"
	},
	asyncComputed: {
		departureHash: {
			async get() {
				if (this.startDate == null) return {}

				const request = req('tgvmax', ['origine', 'destination', 'date'], {
					date: this.startDate,
					origine: 'PARIS (intramuros)'
				})

				const list = await request

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
				if (this.endDate == null) return {}

				const request = req('tgvmax', ['origine', 'destination', 'date'], {
					date: this.endDate,
					destination: 'PARIS (intramuros)'
				})

				const list = await request

				return _.reduce(list, (hash, {fields}) => {
					if (hash[fields.origine] == null) hash[fields.origine] = []
					hash[fields.origine].push(_.pick(fields, 'heure_depart', 'heure_arrivee', 'origine', 'destination'))
					return hash
				}, {})
			},
			default: {}
		},
	},
	computed: {
		destinations () {
			return Object.keys(this.arrivalHash).filter(k => k in this.departureHash).sort()
		}
	}
})
