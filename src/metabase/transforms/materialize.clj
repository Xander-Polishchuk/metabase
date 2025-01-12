(ns metabase.transforms.materialize
  (:require
   [metabase.api.common :as api]
   [metabase.models.card :as card :refer [Card]]
   [metabase.models.collection :as collection :refer [Collection]]
   [metabase.query-processor :as qp]
   [metabase.util :as u]
   [toucan.db :as db]
   [toucan2.core :as t2]))

(declare get-or-create-root-container-collection!)

(defn- root-container-location
  []
  (collection/children-location
   (t2/select-one [Collection :location :id]
     :id (get-or-create-root-container-collection!))))

(defn get-collection
  "Get collection named `collection-name`. If no location is given root collection for automatically
   generated transforms is assumed (see `get-or-create-root-container-collection!`)."
  ([collection-name]
   (get-collection collection-name (root-container-location)))
  ([collection-name location]
   (t2/select-one-pk Collection
     :name     collection-name
     :location location)))

(defn- create-collection!
  ([collection-name color description]
   (create-collection! collection-name color description (root-container-location)))
  ([collection-name color description location]
   (u/the-id
    (db/insert! Collection
      {:name        collection-name
       :color       color
       :description description
       :location    location}))))

(defn- get-or-create-root-container-collection!
  "Get or create container collection for transforms in the root collection."
  []
  (let [location "/"
        name     "Automatically Generated Transforms"]
    (or (get-collection name location)
        (create-collection! name "#509EE3" nil location))))

(defn fresh-collection-for-transform!
  "Create a new collection for all the artefacts belonging to transform, or reset it if it already
   exists."
  [{:keys [name description]}]
  (if-let [collection-id (get-collection name)]
    (db/delete! Card :collection_id collection-id)
    (create-collection! name "#509EE3" description)))

(defn make-card-for-step!
  "Make and save a card for a given transform step and query."
  [{:keys [name transform description]} query]
  (->> {:creator_id             api/*current-user-id*
        :dataset_query          query
        :description            description
        :name                   name
        :collection_id          (get-collection transform)
        :result_metadata        (qp/query->expected-cols query)
        :visualization_settings {}
        :display                :table}
       card/populate-query-fields
       (db/insert! Card)))
