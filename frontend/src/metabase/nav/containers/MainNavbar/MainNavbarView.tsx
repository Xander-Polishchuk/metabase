import React, { useCallback } from "react";
import { t } from "ttag";
import _ from "underscore";

import { IconProps } from "metabase/components/Icon";
import { Tree } from "metabase/components/tree";
import TippyPopoverWithTrigger from "metabase/components/PopoverWithTrigger/TippyPopoverWithTrigger";

import {
  getCollectionIcon,
  PERSONAL_COLLECTIONS,
} from "metabase/entities/collections";
import { getDataAppIcon } from "metabase/entities/data-apps";
import { isSmallScreen } from "metabase/lib/dom";
import * as Urls from "metabase/lib/urls";

import type { Bookmark, Collection, DataApp, User } from "metabase-types/api";

import { SelectedItem } from "./types";
import BookmarkList from "./BookmarkList";
import { SidebarCollectionLink, SidebarLink } from "./SidebarItems";
import {
  AddYourOwnDataLink,
  CollectionMenuList,
  CollectionsMoreIcon,
  CollectionsMoreIconContainer,
  PaddedSidebarLink,
  SidebarContentRoot,
  SidebarHeading,
  SidebarHeadingWrapper,
  SidebarSection,
} from "./MainNavbar.styled";

interface CollectionTreeItem extends Collection {
  icon: string | IconProps;
  children: CollectionTreeItem[];
}

type Props = {
  isAdmin: boolean;
  isOpen: boolean;
  currentUser: User;
  bookmarks: Bookmark[];
  hasDataAccess: boolean;
  hasOwnDatabase: boolean;
  collections: CollectionTreeItem[];
  dataApps: DataApp[];
  selectedItems: SelectedItem[];
  handleCloseNavbar: () => void;
  handleLogout: () => void;
  handleCreateNewCollection: () => void;
  reorderBookmarks: ({
    newIndex,
    oldIndex,
  }: {
    newIndex: number;
    oldIndex: number;
  }) => void;
};

const BROWSE_URL = "/browse";
const OTHER_USERS_COLLECTIONS_URL = Urls.otherUsersPersonalCollections();
const ARCHIVE_URL = "/archive";
const ADD_YOUR_OWN_DATA_URL = "/admin/databases/create";

function MainNavbarView({
  isAdmin,
  currentUser,
  bookmarks,
  collections,
  dataApps,
  hasOwnDatabase,
  selectedItems,
  hasDataAccess,
  reorderBookmarks,
  handleCreateNewCollection,
  handleCloseNavbar,
}: Props) {
  const {
    card: cardItem,
    collection: collectionItem,
    dashboard: dashboardItem,
    "data-app": dataAppItem,
    "non-entity": nonEntityItem,
  } = _.indexBy(selectedItems, item => item.type);

  const onItemSelect = useCallback(() => {
    if (isSmallScreen()) {
      handleCloseNavbar();
    }
  }, [handleCloseNavbar]);

  return (
    <SidebarContentRoot>
      <div>
        <SidebarSection>
          <ul>
            <PaddedSidebarLink
              isSelected={nonEntityItem?.url === "/"}
              icon="home"
              onClick={onItemSelect}
              url="/"
            >
              {t`Home`}
            </PaddedSidebarLink>
          </ul>
        </SidebarSection>

        {bookmarks.length > 0 && (
          <SidebarSection>
            <BookmarkList
              bookmarks={bookmarks}
              selectedItem={
                cardItem ?? dashboardItem ?? dataAppItem ?? collectionItem
              }
              onSelect={onItemSelect}
              reorderBookmarks={reorderBookmarks}
            />
          </SidebarSection>
        )}

        <SidebarSection>
          <CollectionSectionHeading
            currentUser={currentUser}
            handleCreateNewCollection={handleCreateNewCollection}
          />
          <Tree
            data={collections}
            selectedId={collectionItem?.id}
            onSelect={onItemSelect}
            TreeNode={SidebarCollectionLink}
            role="tree"
          />
        </SidebarSection>

        {dataApps.length > 0 && (
          <SidebarSection>
            <SidebarHeadingWrapper>
              <SidebarHeading>{t`Apps`}</SidebarHeading>
            </SidebarHeadingWrapper>
            <ul>
              {dataApps.map(app => (
                <PaddedSidebarLink
                  key={`app-${app.id}`}
                  icon={getDataAppIcon(app)}
                  url={Urls.dataApp(app, { mode: "preview" })}
                  isSelected={dataAppItem?.id === app.id}
                >
                  {app.collection.name}
                </PaddedSidebarLink>
              ))}
            </ul>
          </SidebarSection>
        )}

        {hasDataAccess && (
          <SidebarSection>
            <SidebarHeadingWrapper>
              <SidebarHeading>{t`Data`}</SidebarHeading>
            </SidebarHeadingWrapper>
            <ul>
              <PaddedSidebarLink
                icon="database"
                url={BROWSE_URL}
                isSelected={nonEntityItem?.url?.startsWith(BROWSE_URL)}
                onClick={onItemSelect}
                data-metabase-event="NavBar;Data Browse"
              >
                {t`Browse data`}
              </PaddedSidebarLink>
              {!hasOwnDatabase && isAdmin && (
                <AddYourOwnDataLink
                  icon="add"
                  url={ADD_YOUR_OWN_DATA_URL}
                  isSelected={nonEntityItem?.url?.startsWith(
                    ADD_YOUR_OWN_DATA_URL,
                  )}
                  onClick={onItemSelect}
                  data-metabase-event="NavBar;Add your own data"
                >
                  {t`Add your own data`}
                </AddYourOwnDataLink>
              )}
            </ul>
          </SidebarSection>
        )}
      </div>
    </SidebarContentRoot>
  );
}

interface CollectionSectionHeadingProps {
  currentUser: User;
  handleCreateNewCollection: () => void;
}

function CollectionSectionHeading({
  currentUser,
  handleCreateNewCollection,
}: CollectionSectionHeadingProps) {
  const renderMenu = useCallback(
    ({ closePopover }) => (
      <CollectionMenuList>
        <SidebarLink
          icon="add"
          onClick={() => {
            closePopover();
            handleCreateNewCollection();
          }}
        >
          {t`New collection`}
        </SidebarLink>
        {currentUser.is_superuser && (
          <SidebarLink
            icon={getCollectionIcon(PERSONAL_COLLECTIONS)}
            url={OTHER_USERS_COLLECTIONS_URL}
            onClick={closePopover}
          >
            {t`Other users' personal collections`}
          </SidebarLink>
        )}
        <SidebarLink
          icon="view_archive"
          url={ARCHIVE_URL}
          onClick={closePopover}
        >
          {t`View archive`}
        </SidebarLink>
      </CollectionMenuList>
    ),
    [currentUser, handleCreateNewCollection],
  );

  return (
    <SidebarHeadingWrapper>
      <SidebarHeading>{t`Collections`}</SidebarHeading>
      <CollectionsMoreIconContainer>
        <TippyPopoverWithTrigger
          renderTrigger={({ onClick }) => (
            <CollectionsMoreIcon name="ellipsis" onClick={onClick} size={12} />
          )}
          popoverContent={renderMenu}
        />
      </CollectionsMoreIconContainer>
    </SidebarHeadingWrapper>
  );
}

export default MainNavbarView;
