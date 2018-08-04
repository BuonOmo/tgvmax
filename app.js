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

const sncfDateFormat = date => [_.padStart(date.getFullYear(),  4, "0"),
                                _.padStart(date.getMonth() + 1, 2, "0"),
                                _.padStart(date.getDate(),      2, "0")].join`-`

const initialLocation = 'PARIS (intramuros)'

const app = new Vue({
	el: '#app',
	data: {
		location: initialLocation,
		debouncedLocation: initialLocation,
		startDate: sncfDateFormat(daysFromNow(3)),
		endDate: sncfDateFormat(daysFromNow(5)),
		departureCount: 0,
		arrivalCount: 0,
		error: null
	},
	watch: {
		location: _.debounce(function(val) {
			this.debouncedLocation = val
			}, 1000)
	},
	asyncComputed: {
		departureHash: {
			async get() {
				if (_.isNil(this.startDate)) return {}

				const request = req('tgvmax', ['origine', 'destination', 'date', 'od_happy_card'], {
					date: this.startDate,
					origine: this.debouncedLocation,
					od_happy_card: 'OUI'
				})

				const list = await request
				if (_.isNil(list)) {
					this.departureCount = 0
					this.error = "Une erreur 500 est survenu sur l'API SNCF."
					return []
				}

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
					destination: this.debouncedLocation,
					od_happy_card: 'OUI'
				})

				const list = await request
				if (_.isNil(list)) {
					this.departureCount = 0
					this.error = "Une erreur 500 est survenu sur l'API SNCF."
					return []
				}

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
