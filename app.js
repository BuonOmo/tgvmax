const BASE_URL = 'https://data.sncf.com/api/records/1.0/search/'

const req = async (dataset, facets, refine) => {
	const facetString = `facet=${facets.join('&facet=')}`
	const datasetString = `dataset=${dataset}`
	const refineString = Object.keys(refine).map(facet =>
		`refine.${facet}=${refine[facet]}`
	).join('&')

	const response = await fetch(`${BASE_URL}?${datasetString}&${facetString}&${refineString}&rows=50`)
	const json = await response.json()

	return json['records']
}

const app = new Vue({
	el: '#app',
	data: {
		startDate: null,
		endDate: null
	},
	asyncComputed: {
		records: async function () {
			if (this.startDate == null || this.endDate == null) return []
			const startRequest = req('tgvmax', ['origine', 'destination', 'date'], {
				date: this.startDate,
				origine: 'PARIS (intramuros)'
			})

			const endRequest = req('tgvmax', ['origine', 'destination', 'date'], {
				date: this.startDate,
				destination: 'PARIS (intramuros)'
			})

			const startList = await startRequest
			const endList = await endRequest

			// We want the later result
			endList.reverse()

			return _.flatMap(startList, startTrip =>
				endList
					.filter(endTrip =>
						startTrip.fields.destination === endTrip.fields.origine
					)
					.map(endTrip => {
						console.log(startTrip.fields.heure_depart)
						return ({
							startTime: startTrip.fields.heure_depart,
							endTime: endTrip.fields.heure_depart,
							destination: startTrip.fields.destination
						})
					})
			)
		}
	}
})
